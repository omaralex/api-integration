import serverless from "serverless-http";
import express from "express";
import routes from "./routes";
import getClientFromQueue from "./services/sperant/sync/queue/consumer/getClientFromQueue";

const app = express();
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use('/api', routes);

export const api = serverless(app);
export const queue = (sqsEvent, context, callback) => getClientFromQueue(sqsEvent, context, callback);
