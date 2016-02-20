DROP VIEW  IF EXISTS sw;
CREATE VIEW sw AS
SELECT id,
document_sw->>'Spolka' as symbol,
document_sw->>'Sektor' as type,
(document_sw->>'Kurs zamkniecia')::numeric(9,2) as price,
document_sw->>'Rating' as rating,
(document_sw->>'Wartosc ksiegowa')::numeric(9,2) as bv,
(document_sw->>'Wartosc skorygowanych aktywow netto')::numeric(9,2) as nav_adjusted,
(document_sw->>'Wyliczona srednia')::numeric(9,2) as value_avg,
round((
	(document_sw->>'Wyliczona srednia')::numeric(9,2)-(document_sw->>'Kurs zamkniecia')::numeric(9,2))/
			(document_sw->>'Kurs zamkniecia')::numeric(9,2),
	2)*100 as potential
FROM stock
ORDER BY potential DESC
