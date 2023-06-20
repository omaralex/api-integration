import { get } from "lodash";
import { toTimestamp, getDateNow } from "../../utils/date";
import ClientDAO from "../../services/sperant/dao/ClientDAO";
import UpdateClientHubspot from "../../services/hubspot/UpdateClient";

const updateClient = async (req, res) => {
    try {
        const props = get(req.body, 'properties');
        const clientIdSperant = get(props, 'id_de_sperant.value');
        const clientIdHubspot = get(props, 'hs_object_id.value');
        const clientEmail = get(props, 'email.value');

        let queryClient;
        if (clientIdSperant)
            queryClient = await ClientDAO.getClientById(clientIdSperant);
        else
            queryClient = await ClientDAO.getClientByEmail(clientEmail);

        if (queryClient.length > 0) {
            const payloadClient = {};
            payloadClient.fecha_de_creacion_del_contacto_en_sperant = toTimestamp(queryClient[0].fecha_creacion);
            payloadClient.ultima_fecha_de_interaccion_del_cliente_en_sperant = toTimestamp(queryClient[0].fecha_ultima_interaccion);
            payloadClient.firstname = queryClient[0].nombres;
            payloadClient.lastname = queryClient[0].apellidos;
            payloadClient.address = queryClient[0].direccion;
            payloadClient.cantidad_interacciones = queryClient[0].total_interacciones;
            payloadClient.conyugue = queryClient[0].documento_conyuge;
            payloadClient.email = queryClient[0].email;
            payloadClient.id_de_sperant = queryClient[0].id;
            payloadClient.phone = queryClient[0].celulares;
            payloadClient.documento_de_identidad___dni_vf = queryClient[0].documento;
            payloadClient.media_captacion_sperant = queryClient[0].medio_captacion;
            payloadClient.sexo = queryClient[0].genero;
            payloadClient.ocupacion = queryClient[0].ocupacion;
            payloadClient.distrito_residencia = queryClient[0].distrito;
            payloadClient.fecha_de_nacimiento = queryClient[0].fecha_nacimiento;
            payloadClient.ultima_fecha_de_sincronizacion = getDateNow();
            payloadClient.fecha_de_actualizacion_de_datos_del_cliente_en_sperant = toTimestamp(queryClient[0].fecha_actualizacion);
            payloadClient.fuente_de_datos_de_la_sincronizacion = 'DATAWAREHOUSE';

            UpdateClientHubspot(clientIdHubspot, payloadClient)
                .then((result) => {
                    res.status(200).json({
                        data: result
                    });
                })
                .catch((error) => {
                    console.error('[ERROR][updateClient][UpdateClientHubspot]: %s', error.message);
                    res.status(500).json({
                        error
                    });
                });
        } else {
            const error = 'No sé encontro el contacto con el id ' + clientIdSperant;
            console.log('[updateClient]:', error);
            res.status(500).json({
                error
            });
        }
    } catch (error) {
        console.error('[ERROR][updateClient]: %s', error.message);
        res.status(500).json({
            error: get(error, 'response.data.errors', error.message)
        });
    }
};

export default updateClient;
