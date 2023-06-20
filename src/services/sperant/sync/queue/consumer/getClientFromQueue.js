import httpClient from "../../../../../clients/http/HttpClient";
import sqsClient from "../../../../../clients/queue/sqsClient";
import { NonRetriableError } from './../../../../../errors/non-retriable.error';

const getClientFromQueue = async (sqsEvent, context, callback) => {
    const sendDataToSperant = (data) => {
        return httpClient.post("clients", data)
    }

    const deleteMessages = async (deleteMessageRequests) => {
        if (deleteMessageRequests.length <= 0) {
            return;
        }

        const result = await sqsClient.deleteMessageBatch({
            QueueUrl: `${process.env.QUEUE_URL}`,
            Entries: deleteMessageRequests.map((m) => ({
                Id: m.id,
                ReceiptHandle: m.receiptHandle,
            })),
        }).promise();

        if (result.Failed.length > 0) {
            callback(new Error('Unable to delete messages from queue.'));
        }
    }

    const messagesToDelete = [];
    const promises = sqsEvent.Records.map(async (record) => {
        const message = JSON.parse(record.body);
        const recordToDelete = {
            id: record.messageId,
            receiptHandle: record.receiptHandle,
        }
        try {
            await sendDataToSperant(message);
            messagesToDelete.push(recordToDelete);
        } catch (error) {
            if (error instanceof NonRetriableError) {
                messagesToDelete.push(recordToDelete);
                console.log('[SYNC_SPERANT_ERROR]: caused a non retriable error. Error: ', error);
            } else {
                console.log('[SYNC_SPERANT_ERROR]: caused a retriable error. Error: ', error);
            }
        }

    });

    await Promise.all(promises);
    const numRetriableMessages =
        sqsEvent.Records.length - messagesToDelete.length;
    if (numRetriableMessages > 0) {
        await deleteMessages(messagesToDelete);
        const errorMessage = `Failing due to ${numRetriableMessages} unsuccessful and retriable errors.`;
        console.log('[SYNC_SPERANT_ERROR]:', errorMessage);
        callback(new Error(errorMessage));
    } else {
        callback(null)
    }
}

export default getClientFromQueue;