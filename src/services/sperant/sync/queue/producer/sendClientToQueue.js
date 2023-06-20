import { get, toInteger } from "lodash";
import sqsClient from "../../../../../clients/queue/sqsClient";

const sync = async (req, res) => {
  try {
    const props = get(req.body, 'properties');
    const fname = get(props, 'firstname.value');
    const lname = get(props, 'lastname.value');
    const document = get(props, 'documento_de_identidad___dni_vf.value');
    const email = get(props, 'email.value');
    const utm_source = get(props, 'utm_source.value', '');
    const utm_campaign = get(props, 'utm_campaign.value', '');
    const utm_medium = get(props, 'utm_medium.value', '');
    const interest_type_id = 5;
    const source_id = get(props, 'source_id.value', "");
    const phone = get(props, 'phone.value', "");
    const input_channel_id = toInteger(get(props, 'input_channel_ids.value', ""));
    const publicity_consent = get(props, 'publicity_consent.value', "false");
    const project_id = toInteger(get(props, 'proyecto_interes.value', ""));

    const data = {
      fname,
      lname,
      email,
      document,
      interest_type_id,
      source_id,
      utm_source,
      utm_medium,
      utm_campaign,
      phone,
      project_id,
      input_channel_id,
      publicity_consent: publicity_consent === "true",
    }

    const result = await sqsClient.sendMessage({
      QueueUrl: `${process.env.QUEUE_URL}`,
      MessageBody: JSON.stringify(data),
      MessageGroupId: get(props, 'hs_object_id.value'),
    }).promise();

    res.status(200).json({ data: result });
  } catch (error) {
    console.log('[ERROR SEND QUEUE OF SYNC]:', e)
    res.status(500).json({
      error: get(error, 'response.data.errors', error.message)
    });
  }
};

export default sync;
