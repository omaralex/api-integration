import { get } from "lodash";
import { toTimestamp, getDateNow } from "../../utils/date";
import DealDAO from "../../services/sperant/dao/DealDAO";
import UpdateDeal from "../../services/hubspot/UpdateDeal";
import FilterClient from "../../services/hubspot/FilterClient";
import AssocClientDeal from "../../services/hubspot/AssocClientDeal";

const updateDeal = async (req, res) => {
    try {
        const props = get(req.body, 'properties');
        const dealId = get(props, 'hs_object_id.value');
        const budgetCodeSperant = get(props, 'codigo_de_proforma.value');

        const queryDeal = await DealDAO.getDealInfo(budgetCodeSperant);
        if (queryDeal.length > 0) {
            const payloadDeal = {};
            if (queryDeal[0].estado_comercial == 'proceso de separación') {
                payloadDeal.fecha_de_creacion_del_proceso_de_venta = toTimestamp(queryDeal[0].fecha_separacion);
                payloadDeal.monto_separacion = queryDeal[0].monto_separacion;
                payloadDeal.usuario_separador = queryDeal[0].usuario_separacion;
                payloadDeal.dealstage = "qualifiedtobuy";
            }
            if (queryDeal[0].estado_comercial == 'vendido') {
                payloadDeal.fecha_de_cierre_del_proceso_de_venta = toTimestamp(queryDeal[0].fecha_venta);
                payloadDeal.dealstage = "closedwon";
            }
            if (queryDeal[0].fecha_anulacion) {
                payloadDeal.fecha_de_anulacion_del_proceso_de_venta = toTimestamp(queryDeal[0].fecha_anulacion);
                payloadDeal.dealstage = "closedlost";
            }

            payloadDeal.dealname = queryDeal[0].codigo_unidad;
            payloadDeal.dpto_separada__dpto_s___estac_s___depos__s_ = queryDeal[0].codigo_unidades_asignadas;
            payloadDeal.amount = queryDeal[0].precio_venta;
            payloadDeal.proyecto_de_separacion = queryDeal[0].nombre_proyecto;
            payloadDeal.usuario_creador = queryDeal[0].usuario_creador;
            payloadDeal.fuente_de_datos_de_la_sincronizacion = "DATAWAREHOUSE",

            UpdateDeal(dealId, payloadDeal)
                .then(() => {
                    const filterClient = {
                        propertyName: 'id_de_sperant',
                        operator: 'EQ',
                        value: queryDeal[0].id_cliente,
                    };

                    const propertiesToFilter = ['hs_object_id'];
                    FilterClient(filterClient, [], propertiesToFilter)
                        .then((responseFilterClient) => {
                            const resultsFilterClient = responseFilterClient.results;
                            if (resultsFilterClient.length > 0) {
                                const payloadAssoc = {
                                    id_contact: queryDeal[0].id_cliente,
                                    id_deal: dealId
                                }
                                AssocClientDeal(payloadAssoc)
                                    .then((responseAssocClientDeal) => {
                                        res.status(200).json({
                                            data: responseAssocClientDeal,
                                        });
                                    })
                                    .catch((error) => {
                                        res.status(500).json({
                                            error: get(error, 'response.data.errors', error.message)
                                        });
                                    });
                            } else {
                                const payloadClient = {
                                    fecha_de_creacion_del_contacto_en_sperant: toTimestamp(queryDeal[0].fecha_creacion_cliente),
                                    ultima_fecha_de_interaccion_del_cliente_en_sperant: toTimestamp(queryDeal[0].fecha_ultima_interaccion_cliente),
                                    firstname: queryDeal[0].nombres_cliente,
                                    lastname: queryDeal[0].apellidos_cliente,
                                    email: queryDeal[0].email,
                                    id_de_sperant: queryDeal[0].id_cliente,
                                    phone: queryDeal[0].celulares,
                                    documento_de_identidad___dni_vf: queryDeal[0].documento,
                                    sexo: queryDeal[0].genero,
                                    ultima_fecha_de_sincronizacion: getDateNow(),
                                    fuente_de_datos_de_la_sincronizacion: 'DATAWAREHOUSE'
                                };
                                CreateClient(payloadClient)
                                    .then(() => {
                                        const payloadAssoc = {
                                            id_contact: queryDeal[0].id_cliente,
                                            id_deal: dealId
                                        }
                                        AssocClientDeal(payloadAssoc)
                                            .then((responseAssocClientDeal) => {
                                                res.status(200).json({
                                                    data: responseAssocClientDeal,
                                                });
                                            })
                                            .catch((error) => {
                                                console.error('[ERROR][updateDeal][AssocClientDeal]: %s', error.message);
                                                res.status(500).json({
                                                    error: get(error, 'response.data.errors', error.message)
                                                });
                                            });
                                    })
                                    .catch((error) => {
                                        console.error('[ERROR][updateDeal][CreateClient]: %s', error.message);
                                        res.status(500).json({
                                            error: get(error, 'response.data.errors', error.message)
                                        });
                                    });

                            }
                        })
                        .catch((error) => {
                            console.error('[ERROR][updateDeal][FilterClient]: %s', error.message);
                            res.status(500).json({
                                error: get(error, 'response.data.errors', error.message)
                            });
                        })
                })
                .catch((error) => {
                    console.error('[ERROR][updateDeal][UpdateDeal]: %s', error.message);
                    res.status(500).json({
                        error: get(error, 'response.data.errors', error.message)
                    });
                })

        } else {
            const error = 'No sé encontro el deal con la proforma' + budgetCodeSperant;
            console.log('[updateDeal]:', error);
            res.status(500).json({
                error
            });
        }

    } catch (error) {
        console.error('[ERROR][updateDeal]: %s', error.message);
        res.status(500).json({
            error: get(error, 'response.data.errors', error.message)
        });
    }

}

export default updateDeal;