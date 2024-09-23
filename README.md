# smtp-httpapi

Convert your SMTP account into HTTP API, a ["Nodemailer"](https://github.com/nodemailer/nodemailer) wrapper.

## Full Configuration

```yml
account:
  - email: example@domain.ltd
    password: 123456
    host: smtp.domain.ltd
    port: 465
    secure: false
    envelope:
      - sender: '"John Joe" <example@domain.ltd>'
  - email: example2@domain.ltd
    password: 123456
    preset: Outlook365 # You can find all "services" on https://github.com/nodemailer/nodemailer/blob/master/lib/well-known/services.json
    envelope:
      - sender: '"Joe Smith" <example@domain.ltd>'
auth:
  whitelist:
    - 1.1.1.1
  secure_code: smtp2httpapi
server:
  port: 3000

```

## Disclaimer

- This project is not affiliated with Nodemailer.
- This project does not provide any security guarantees. Users assume all risks.
- The author of this project is not liable for any economic or legal consequences arising from the use of this project in derivative open-source or closed-source projects.