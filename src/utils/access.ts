import type { Context } from 'hono'
import { getConnInfo } from '@hono/node-server/conninfo'

const invalidIps = [
    '127.0.0.1',
    '::1',
]

export function getRealRemoteIp(c: Context): string | undefined {
    let headerIp = c.req.header("x-forwarded-for");
    if(headerIp && !invalidIps.includes(headerIp)) return headerIp;
    // consider inside containers, headerIp should be higher.
    let client = getConnInfo(c);
    if(client.remote.address && !invalidIps.includes(client.remote.address)) return client.remote.address;
    // behind cdn like Cloudflare or etc.
    return;
}