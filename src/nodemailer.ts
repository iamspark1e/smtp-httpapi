import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import { SMTPAccountType } from './types';
import type { SMTPAccountTypeByPreset } from './types'

type SingleTransporterType = {
    sender?: string
    transporter: Mail
}
type NodeMailerTransporterType = {
    [key: string]: SingleTransporterType
}

function isPresetAccount(account: SMTPAccountType): account is SMTPAccountTypeByPreset {
    return (<SMTPAccountTypeByPreset>account).preset !== undefined;
}

class WrappedNodeMailer {
    transporters: NodeMailerTransporterType = {};
    defaultTransporter: SingleTransporterType | null = null;
    constructor(accounts: SMTPAccountType[]) {
        accounts.forEach(account => {
            if (isPresetAccount(account)) {
                this.transporters[account.email] = {
                    transporter: nodemailer.createTransport({
                        pool: true,
                        service: account.preset,
                        auth: {
                            user: account.email,
                            pass: account.password
                        }
                    })
                }
                if(account.envelope?.sender) this.transporters[account.email].sender = account.envelope.sender
                if (account.is_default && !this.defaultTransporter) {
                    this.defaultTransporter = this.transporters[account.email];
                }
            } else {
                this.transporters[account.email] = {
                    transporter: nodemailer.createTransport({
                        pool: true,
                        host: account.host,
                        port: account.port,
                        secure: account.secure,
                        auth: {
                            user: account.email,
                            pass: account.password
                        }
                    })
                }
                if(account.envelope?.sender) this.transporters[account.email].sender = account.envelope.sender
                if (account.is_default && !this.defaultTransporter) {
                    this.defaultTransporter = this.transporters[account.email];
                }
            }
        })
    }
}

export default WrappedNodeMailer;