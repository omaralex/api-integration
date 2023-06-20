import { get } from "lodash";
import { CLIENT_CREATED, CLIENT_DIGITAL, ACTIVITY_MANUAL_CREATED, PROCESS_SALE_COMPLETED, PROCESS_CANCELED_CREATED, PROCESS_SEPARATION_CREATED } from "./constants";
import { toTimestamp, getDateNow } from "../../utils/date";
import CreateClient from "../../services/hubspot/CreateClient";
import FilterClient from "../../services/hubspot/FilterClient";
import UpdateClient from "../../services/hubspot/UpdateClient";
import AssocClientDeal from "../../services/hubspot/AssocClientDeal";
import CreateDeal from "../../services/hubspot/CreateDeal";
import UpdateDeal from "../../services/hubspot/UpdateDeal";
import FilterDeal from "../../services/hubspot/FilterDeal";

const sync = async (req, res) => {
  const event_name = get(req.body, 'event_name', "");
  switch (event_name) {
    case CLIENT_DIGITAL:
    case CLIENT_CREATED: {
      const payload = {
        fecha_de_creacion_del_contacto_en_sperant: toTimestamp(get(req.body, 'client.created_at')),
        ultima_fecha_de_interaccion_del_cliente_en_sperant: toTimestamp(get(req.body, 'client.last_interaction_at')),
        firstname: get(req.body, 'client.fname'),
        lastname: get(req.body, 'client.lname'),
        email: get(req.body, 'client.email'),
        id_de_sperant: get(req.body, 'client.id'),
        proyecto_interes: get(req.body, 'client.project_id'),
        phone: get(req.body, 'client.phone'),
        documento_de_identidad___dni_vf: get(req.body, 'client.document'),
        media_captacion_sperant: get(req.body, 'client.captation_way'),
        sexo: get(req.body, 'client.gender'),
        ultima_fecha_de_sincronizacion: getDateNow(),
        fuente_de_datos_de_la_sincronizacion: 'WEBHOOK'
      };
      CreateClient(payload)
        .then((result) => {
          res.status(200).json({
            data: result
          });
        })
        .catch((error) => {
          console.error('[ERROR][CLIENT_CREATED/CLIENT_DIGITAL][CreateClient]: %s', error.message);
          res.status(500).json({
            error
          });
        });
      break;
    }
    case ACTIVITY_MANUAL_CREATED: {
      const clientIdSperant = get(req.body, 'activity.client_id');
      const completedAt = get(req.body, 'activity.created_at');
      const filter = {
        propertyName: 'id_de_sperant',
        operator: 'EQ',
        value: clientIdSperant,
      };

      const propertiesToFilter = ['hs_object_id'];
      FilterClient(filter, [], propertiesToFilter)
        .then(async (response) => {
          const results = response.results;
          if (results.length > 0) {
            const contactIdHubspot = results[0].id;
            UpdateClient(contactIdHubspot, {
              ultima_fecha_de_interaccion_del_cliente_en_sperant: toTimestamp(completedAt),
              ultima_fecha_de_sincronizacion: getDateNow(),
              fuente_de_datos_de_la_sincronizacion: 'WEBHOOK'
            })
              .then((result) => {
                res.status(200).json({
                  data: result
                });
              })
              .catch((error) => {
                console.log('[ERROR][ACTIVITY_MANUAL_CREATED][UpdateClient]: %s', error.message);
                res.status(500).json({
                  error
                });
              });
          } else {
            const queryClient = await ClientDAO.getClientById(clientIdSperant);
            if (queryClient.length > 0) {
              const payloadClient = {};
              payloadClient.fecha_de_creacion_del_contacto_en_sperant = toTimestamp(queryClient[0].fecha_creacion);
              payloadClient.ultima_fecha_de_interaccion_del_cliente_en_sperant = toTimestamp(completedAt);
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
              payloadClient.fuente_de_datos_de_la_sincronizacion = 'WEBHOOK';
              CreateClient(payloadClient)
                .then((result) => {
                  res.status(200).json({
                    data: result
                  });
                })
                .catch((error) => {
                  console.error('[ERROR][ACTIVITY_MANUAL_CREATED][CreateClient]: %s', error.message);
                  res.status(500).json({
                    error
                  });
                });
            } else {
              console.log('[ACTIVITY_MANUAL_CREATED]:', 'No sé encontro el contacto con el id ' + clientIdSperant);
            }
          }
        })
        .catch((error) => {
          console.log('[ERROR][ACTIVITY_MANUAL_CREATED][FilterClient]: %s', error.message);
          res.status(500).json({
            error
          });
        });
      break;
    }
    case PROCESS_SEPARATION_CREATED:
    case PROCESS_CANCELED_CREATED:
    case PROCESS_SALE_COMPLETED:
      const clientIdSperant = get(req.body, 'process_unit.client_id');
      const filterClient = {
        propertyName: 'id_de_sperant',
        operator: 'EQ',
        value: clientIdSperant,
      };

      const getDealStage = () => {
        switch (event_name) {
          case PROCESS_SEPARATION_CREATED:
            return {
              fecha_de_creacion_del_proceso_de_venta: toTimestamp(get(req.body, 'process_unit.created_at')),
              dealstage: "qualifiedtobuy"
            };
          case PROCESS_CANCELED_CREATED:
            return {
              fecha_de_anulacion_del_proceso_de_venta: toTimestamp(get(req.body, 'process_unit.created_at')),
              dealstage: "closedlost"
            };
          case PROCESS_SALE_COMPLETED:
            return {
              fecha_de_cierre_del_proceso_de_venta: toTimestamp(get(req.body, 'process_unit.completed_at')),
              dealstage: "closedwon"
            };
          default:
            return {
              dealstage: "appointmentscheduled"
            };
        }
      }

      const AssocClientToDeal = () => {
        const payloadDeal = {
          pipeline: "default",
          codigo_de_proforma: get(req.body, 'process_unit.budget_code'),
          id_de_proforma: get(req.body, 'process_unit.budget_id'),
          fuente_de_datos_de_la_sincronizacion: "WEBHOOK",
          ...getDealStage()
        }
        const filterDeal = {
          propertyName: 'codigo_de_proforma',
          operator: 'EQ',
          value: payloadDeal.codigo_de_proforma,
        };
        const propertiesToFilter = ['hs_object_id'];
        FilterDeal(filterDeal, [], propertiesToFilter)
          .then(async (responseFilterDeal) => {
            let dealIdHubspot = null;
            let responseCreateDeal = null;
            const resultsFilterDeal = responseFilterDeal.results;

            if (resultsFilterDeal.length > 0) {
              dealIdHubspot = resultsFilterDeal[0].id
            } else {
              responseCreateDeal = await CreateDeal(payloadDeal);
              dealIdHubspot = get(responseCreateDeal, 'id', null);
            }
            if (dealIdHubspot !== null) {
              const payloadAssoc = {
                id_contact: clientIdSperant,
                id_deal: dealIdHubspot
              }
              AssocClientDeal(payloadAssoc)
                .then(() => {

                  UpdateDeal(dealIdHubspot, {
                    fuente_de_datos_de_la_sincronizacion: 'WEBHOOK'
                  })
                    .then((result) => {
                      res.status(200).json({
                        data: result
                      });
                    })
                    .catch((error) => {
                      console.error('[ERROR][PROCESS_SALE_COMPLETED/PROCESS_CANCELED_CREATED/PROCESS_SEPARATION_CREATED][UpdateDeal]: %s', error.message);
                      res.status(500).json({
                        error
                      });
                    });

                })
                .catch((error) => {
                  console.error('[ERROR][PROCESS_SALE_COMPLETED/PROCESS_CANCELED_CREATED/PROCESS_SEPARATION_CREATED][AssocClientDeal]: %s', error.message);
                  res.status(500).json({
                    error: get(error, 'response.data.errors', error.message)
                  });
                });
            } else {
              console.log('[PROCESS_SALE_COMPLETED/PROCESS_CANCELED_CREATED/PROCESS_SEPARATION_CREATED]:', responseCreateDeal);
              res.status(500).json({
                error: responseCreateDeal
              });
            }
          })
          .catch((error) => {
            console.error('[ERROR][PROCESS_SALE_COMPLETED/PROCESS_CANCELED_CREATED/PROCESS_SEPARATION_CREATED][FilterDeal]: %s', error.message);
            res.status(500).json({
              error
            });
          });
      }

      const propertiesToFilter = ['hs_object_id'];
      FilterClient(filterClient, [], propertiesToFilter)
        .then(async (responseFilterClient) => {
          const resultsFilterClient = responseFilterClient.results;
          if (resultsFilterClient.length > 0) {
            AssocClientToDeal();
          } else {
            const queryClient = await ClientDAO.getClientById(clientIdSperant);
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
              payloadClient.fuente_de_datos_de_la_sincronizacion = 'WEBHOOK';
              CreateClient(payloadClient)
                .then(() => {
                  AssocClientToDeal();
                })
                .catch((error) => {
                  console.error('[ERROR][PROCESS_SALE_COMPLETED/PROCESS_CANCELED_CREATED/PROCESS_SEPARATION_CREATED][CreateClient]: %s', error.message);
                  res.status(500).json({
                    error
                  });
                });
            } else {
              console.log('[PROCESS_SALE_COMPLETED/PROCESS_CANCELED_CREATED/PROCESS_SEPARATION_CREATED]:', 'No sé encontro el contacto con el id ' + clientIdSperant);
            }
          }
        })
        .catch((error) => {
          console.error('[ERROR][PROCESS_SALE_COMPLETED/PROCESS_CANCELED_CREATED/PROCESS_SEPARATION_CREATED][FilterClient]: %s', error.message);
          res.status(500).json({
            error
          });
        });
      break
    default: {
      res.status(404).json({
        error: 'NOT_FOUND',
      });
      break
    }
  }
};

export default sync;
