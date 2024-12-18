import winston from "winston";

export const customLogger = (message: string, ...rest: string[]) => {
    console.log(message, ...rest)
}

export const myWinstonLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.colorize(), // 添加颜色化格式化器
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }), // 时间日期格式
      winston.format.printf(({ timestamp, level, message }: any) => {
        return `${timestamp} ${level}: ${message}`;
      }) // 打印格式
    ),
    transports: [
        new winston.transports.Console(),
    ]
})