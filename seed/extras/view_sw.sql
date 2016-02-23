DROP VIEW  IF EXISTS sw;
CREATE VIEW sw AS
SELECT id,
document->>'Spolka' as symbol,
document->>'Sektor' as type,
(document->>'Kurs zamkniecia')::numeric(9,2) as price,
document->>'Rating' as rating,
(document->>'Wartosc ksiegowa')::numeric(9,2) as bv,
(document->>'Wartosc skorygowanych aktywow netto')::numeric(9,2) as nav_adjusted,
(document->>'Wyliczona srednia')::numeric(9,2) as value_avg,
round((
	(document->>'Wyliczona srednia')::numeric(9,2)-(document->>'Kurs zamkniecia')::numeric(9,2))/
			(document->>'Kurs zamkniecia')::numeric(9,2),
	2)*100 as potential
FROM valuation_sw
ORDER BY potential DESC
