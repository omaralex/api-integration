import { SCHEME_DATA_BASE } from "../../../utils/constants";
import DataBase from "../../../clients/database";

const DealDAO = {
    getDealInfo: (budgetId) => {
        return DataBase.executeQuery(
            `select p.codigo_proforma, 
            p.cliente_id, 
            p.codigo_unidad, 
            p.nombre_proyecto, 
            p.precio_venta, 
            p.fecha_inicio, 
            p.codigo_unidades_asignadas, 
            p.fecha_anulacion,
            p.usuario_creador,
            p.usuario_separacion,
            c.nombres as nombres_cliente,
            c.apellidos as apellidos_cliente,
            c.id as id_cliente,
            c.fecha_ultima_interaccion as fecha_ultima_interaccion_cliente,
            c.fecha_creacion as fecha_creacion_cliente,
            c.email, 
            c.genero, 
            c.documento, 
            c.celulares, 
            u.estado_comercial, 
            u.fecha_separacion,
            u.fecha_venta,
            (select monto_programado
                from ${SCHEME_DATA_BASE}.pagos pa
                where pa.etiqueta = 'Separación' and pa.codigo_proforma = $1) as monto_separacion
            from ${SCHEME_DATA_BASE}.procesos p inner join 
            ${SCHEME_DATA_BASE}.unidades u
            on u.codigo = p.codigo_unidad 
            inner join ${SCHEME_DATA_BASE}.clientes c 
            on p.cliente_id = c.id 
            where p.codigo_proforma = $1 
            order by p.fecha_actualizacion desc`,
            [budgetId]
        );
    }
}

export default DealDAO;
