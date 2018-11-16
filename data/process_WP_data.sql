drop table if exists public.wp_export_data;
select gid,source,
	ST_asText(geom) as geom
	,ST_X(geom) as geomX
	,st_Y(geom) as geomY
into public.wp_export_data
from (
	select gid,'510' as source,geom from public.wp_510
	union all
	select gid,'CJF' as source,geom from public.wp_climatejusticefund
	union all
	select gid,'DoIWD' as source,geom from public.wp_doiwd_conv
	union all
	select gid,'DoS' as source,geom from public.wp_dos_conv
	union all
	select gid,'Madzi Alipo' as source,geom from public.wp_madzialipo_020518
	union all
	select gid,'MRCS' as source,geom from public.wp_mrcs_conv
	union all
	select gid,'OSM' as source,geom from public.wp_osm
	union all
	select gid,'PCI' as source,geom from public.wp_pci_conv
	union all
	select gid,'WPDx' as source,geom from public.wp_wpdx_020518
	) t1
where geom is not null
;



--inner join public.overview_sources_attributes t2 on t1.source = t2.source


