import type Mail from 'nodemailer/lib/mailer'
import * as v from 'valibot'

const SMTPAccountEnvelopeSchema = v.object({
    sender: v.pipe(
        v.string('Your email sender must be a string.'),
        v.nonEmpty('Please enter your email.')
    )
})
type SMTPAccountEnvelopeType = v.InferOutput<typeof SMTPAccountEnvelopeSchema>;

const SMTPAccountSchemaByPreset = v.object({
    email: v.pipe(v.string(), v.nonEmpty(), v.email()),
    password: v.pipe(v.string(), v.nonEmpty()),
    preset: v.pipe(v.string(), v.nonEmpty()),
    // nickname: v.optional(v.string()),
    envelope: v.optional(SMTPAccountEnvelopeSchema),
    is_default: v.optional(v.boolean(), false)
})
export type SMTPAccountTypeByPreset = v.InferOutput<typeof SMTPAccountSchemaByPreset>

const SMTPAccountSchemaByPassword = v.object({
    email: v.pipe(v.string(), v.nonEmpty(), v.email()),
    password: v.pipe(v.string(), v.nonEmpty()),
    host: v.pipe(v.string(), v.nonEmpty()),
    port: v.number(),
    secure: v.optional(v.boolean(), false),
    // nickname: v.optional(v.string()),
    envelope: v.optional(SMTPAccountEnvelopeSchema),
    is_default: v.optional(v.boolean(), false)
})
export type SMTPAccountTypeByPassword = v.InferOutput<typeof SMTPAccountSchemaByPassword>
export type SMTPAccountType = SMTPAccountTypeByPassword | SMTPAccountTypeByPreset;
export const SMTPAccountSchema = v.union([SMTPAccountSchemaByPassword, SMTPAccountSchemaByPreset])

export const GlobalConfigSchema = v.object({
    accounts: v.array(SMTPAccountSchema),
    // sentry: v.optional(v.object({
    //     dsn: v.optional(v.string())
    // })),
    auth: v.object({
        whitelist: v.optional(v.array(v.pipe(v.string(), v.ip()))),
        secure_code: v.string("`auth.secure_code` should be a string")
    }),
    server: v.optional(v.object({
        port: v.optional(v.number("`server.port` should be a number"))
    }))
})
export type GlobalConfigType = v.InferOutput<typeof GlobalConfigSchema>

export const SendMailSchema = v.object({
    from: v.optional(v.pipe(v.string(), v.nonEmpty(), v.email())),
    sender: v.optional(v.pipe(v.string(), v.nonEmpty())),
    to: v.array(v.pipe(v.string(), v.nonEmpty(), v.email())),
    cc: v.optional(v.array(v.pipe(v.string(), v.nonEmpty(), v.email()))),
    bcc: v.optional(v.array(v.pipe(v.string(), v.nonEmpty(), v.email()))),
    subject: v.string(),
    text: v.optional(v.string()),
    html: v.optional(v.string()),
})

export type SendMailType = v.InferOutput<typeof SendMailSchema>
export type SendMailWithAttType = SendMailType & {
    attachments?: Mail.Attachment[]
}