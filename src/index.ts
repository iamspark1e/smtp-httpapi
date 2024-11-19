import { serve } from '@hono/node-server'
import { readFileSync } from 'fs';
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import yaml from 'yaml'
import { GlobalConfigSchema, SendMailSchema, SendMailWithAttType } from './types.js';
import * as v from 'valibot'
import WrappedNodeMailer from './nodemailer.js';
import { getRealRemoteIp } from './utils/access.js';
import { customLogger } from './utils/logger.js';
import { removeNestedNullUndefined } from './utils/tool.js'

const app = new Hono()
app.use(logger(customLogger))

try {
  const configRaw = readFileSync("./config.yml", { encoding: 'utf-8' });
  const configParsed = yaml.parse(configRaw);
  const configRemovedNullKey = removeNestedNullUndefined(configParsed);
  const configValidated = v.parse(GlobalConfigSchema, configRemovedNullKey);

  const configuredAccounts = new WrappedNodeMailer(configValidated.accounts);

  // mount global guard
  // Custom logger
  app.use(async (c, next) => {
    // health route doesn't need check
    if (c.req.path === "/_health") return await next();
    // get client_ip
    let whitelist = configValidated.auth.whitelist;
    let secureCode = c.req.query('secure_code');
    if (!secureCode) {
      secureCode = c.req.header("Authorization");
    }
    if (whitelist?.includes(getRealRemoteIp(c) || "")) {
      await next();
    } else if (secureCode && secureCode === configValidated.auth.secure_code) {
      await next();
    } else {
      c.status(401);
      return c.json({
        ok: 0,
        msg: "You are not allowed to access this endpoint"
      })
    }
  })

  // mount routes
  app.get('/_health', async (c) => {
    let flag = true;
    let obj = Object.keys(configuredAccounts.transporters).map(transporterKey => {
      let status = configuredAccounts.transporters[transporterKey].transporter.isIdle();
      if (!status) flag = false;
      return {
        email: transporterKey,
        is_idle: status
      }
    })

    return c.json({
      ok: flag ? 1 : 0,
      data: obj
    })
  })

  app.get('/_verify', async (c) => {
    let email = c.req.query('email');
    if (!email || !configuredAccounts.transporters[email]) {
      c.status(400);
      return c.json({
        ok: 0,
        msg: "invalid request email"
      })
    }
    try {
      await configuredAccounts.transporters[email].transporter.verify()
    } catch (e) {
      c.status(400);
      return c.json({
        ok: 0,
        msg: e.response
      })
    }
    return c.json({
      ok: 1,
      // data: obj
    })
  })

  app.post('/send', async (c) => {
    let data;
    if (c.req.header('Content-Type') === 'application/json') {
      data = await c.req.json();
    } else if (c.req.header('Content-Type') === 'application/x-www-form-urlencoded' || c.req.header('Content-Type') === 'multipart/form-data') {
      data = await c.req.parseBody();
    }

    let email = data.from;

    let transporter;
    if (email && configuredAccounts.transporters[email]) {
      transporter = configuredAccounts.transporters[email];
    } else if (configuredAccounts.defaultTransporter) {
      transporter = configuredAccounts.defaultTransporter;
    } else {
      c.status(400);
      return c.json({
        ok: 0,
        msg: "no transporter avaliable"
      })
    }

    // GlueCode - Old payload transform
    let adaptedData: SendMailWithAttType = {
      from: email,
      to: [],
      subject: ""
    }
    if (data.to && typeof data.to === 'string') {
      adaptedData.to = data.to.split(",");
    }
    if (data.cc && typeof data.cc === 'string') {
      adaptedData.cc = data.cc.split(",");
    }
    if (data.bcc && typeof data.bcc === 'string') {
      adaptedData.bcc = data.bcc.split(",");
    }
    if (data.use_html) {
      adaptedData.html = data.content;
    } else {
      adaptedData.text = data.content;
    }
    adaptedData.subject = data.subject;
    if (data.attachments) adaptedData.attachments = data.attachments;
    if(transporter.sender) {
      adaptedData.sender = transporter.sender;
    } else {
      adaptedData.sender = adaptedData.from;
    }

    // compare request body with `SendMailWithAttType`
    const result = v.safeParse(SendMailSchema, adaptedData);
    if (!result.success) {
      c.status(400);
      return c.json({
        ok: 0,
        msg: "mail payload invalid, please see detail",
        data: result.issues
      })
    }

    // compare correct and call nodemailer.send
    try {
      await transporter.transporter.sendMail(result.output)
    } catch (e) {
      c.status(500);
      return c.json({
        ok: 0,
        msg: e.message
      })
    }

    // put a custom log
    customLogger(`An Email was sent:
from: ${email || "__default_transporter__"}
to: ${adaptedData.to.join(", ")}
${adaptedData.cc && adaptedData.cc.length > 0 ? `cc: ${adaptedData.cc.join(", ")}` : ""}
${adaptedData.bcc && adaptedData.bcc.length > 0 ? `bcc: ${adaptedData.bcc.join(", ")}` : ""}
subject: ${adaptedData.subject}
text: ${adaptedData.text || ""}
html: ${adaptedData.html || ""}
${adaptedData.attachments && adaptedData.attachments.length > 0 ? `att number: ${adaptedData.attachments.length}` : ""}
`)

    // return send status
    c.status(200)
    return c.json({
      ok: 1
    })
  })

  serve({
    fetch: app.fetch,
    port: configValidated?.server?.port || 38081
  })
} catch (e) {
  if (e.code === 'ENOENT') {
    console.log("config.yml not found.");
  } else if (e instanceof v.ValiError) {
    console.log(`config.yml invalid. Issues: 
${e.issues.map(issue => issue.message).join(",\n")}`);
  } else { throw e; }
}
