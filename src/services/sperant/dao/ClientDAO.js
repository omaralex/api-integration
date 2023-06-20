import { SCHEME_DATA_BASE } from "../../../utils/constants";
import DataBase from "../../../clients/database";

const ClientDAO = {
    getClientById: (clientId) => {
        return DataBase.executeQuery(
            `select * from ${SCHEME_DATA_BASE}.clientes where id = $1`,
            [clientId]
        );
    },
    getClientByEmail: (clientEmail) => {
        return DataBase.executeQuery(
            `select * from ${SCHEME_DATA_BASE}.clientes where email = $1`,
            [clientEmail]
        );
    }
}

export default ClientDAO;