insert into public.regimenes_fiscales (clave, descripcion) values
('601','General de Ley Personas Morales'),('603','Personas Morales con Fines no Lucrativos'),
('605','Sueldos y Salarios e Ingresos Asimilados a Salarios'),('606','Arrendamiento'),
('607','Régimen de Enajenación o Adquisición de Bienes'),('608','Demás ingresos'),
('609','Consolidación'),('610','Residentes en el Extranjero sin Establecimiento Permanente en México'),
('611','Ingresos por Dividendos (socios y accionistas)'),('612','Personas Físicas con Actividades Empresariales y Profesionales'),
('614','Ingresos por intereses'),('616','Sin obligaciones fiscales'),
('620','Sociedades Cooperativas de Producción que optan por diferir sus ingresos'),
('621','Incorporación Fiscal'),('622','Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras'),
('626','Régimen Simplificado de Confianza');

insert into public.cfdi_usos (clave, descripcion) values
('G01','Adquisición de mercancías'),('G02','Devoluciones, descuentos o bonificaciones'),('G03','Gastos en general'),
('I01','Construcciones'),('I02','Mobiliario y equipo de oficina por inversiones'),('I03','Equipo de transporte'),
('I04','Equipo de cómputo y accesorios'),('I05','Dados, troqueles, moldes, matrices y herramental'),
('I06','Comunicaciones telefónicas'),('I07','Comunicaciones satelitales'),('I08','Otra maquinaria y equipo'),
('D01','Honorarios médicos, dentales y gastos hospitalarios'),('D02','Gastos médicos por incapacidad o discapacidad'),
('D03','Gastos funerales');

insert into public.metodos_pago (clave, descripcion) values ('PUE','Pago en una sola exhibición'),('PPD','Pago en parcialidades o diferido');
insert into public.formas_pago (clave, descripcion) values
('01','Efectivo'),('02','Cheque nominativo'),('03','Transferencia electrónica de fondos'),('04','Tarjeta de crédito'),
('05','Monedero electrónico'),('06','Dinero electrónico'),('08','Vales de despensa'),('12','Dación en pago'),
('13','Pago por subrogación'),('14','Pago por consignación'),('15','Condonación'),('17','Compensación'),
('23','Novación'),('24','Confusión'),('25','Remisión de deuda'),('26','Prescripción o caducidad'),
('27','A satisfacción del acreedor'),('28','Tarjeta de débito'),('29','Tarjeta de servicios'),('30','Aplicación de anticipos'),
('31','Intermediario pagos'),('99','Por definir');
insert into public.tipos_relacion (clave, descripcion) values
('01','Nota de crédito de los documentos relacionados'),('02','Nota de débito de los documentos relacionados'),
('03','Devolución de mercancía sobre facturas o traslados previos'),('04','Sustitución de los CFDI previos'),
('05','Traslados de mercancías facturados previamente'),('06','Factura generada por los traslados previos'),
('07','CFDI por aplicación de anticipo'),('08','Facturas generadas por los pagos en parcialidades'),
('09','Facturas generadas por pagos diferidos');

insert into public.codigos_postales (cp, estado, municipio, colonia)
select lpad(n::text, 5, '0'), 'Ciudad de México', 'Álvaro Obregón', 'Colonia de desarrollo'
from generate_series(1000, 3499) as numbers(n)
on conflict (cp) do nothing;
