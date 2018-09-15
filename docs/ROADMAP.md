# JBL Data Center order book

###1. extractTask support postgresql elasticsearch and mongodb exporters
adapter should be provide as a rxjs operator callback.

benefits: faster data export

###2. see structured data as soon as it arrived (continuous data delivery)
- S1: download task perform extraction+export in one RXJS chain?

###3. Merge class declaration + libs code of: 
- downloader
- extractor

###5. Downloader mode (mode=simple | fill | update)
* simple - work as it is, download every UrlItem
* fill - scan document_http table and proceed with all non-200 or missing records
* update - take intersection of input and document_http table and proceed with the oldest

###8. Bugfix downloader should read Interval Time from job first OR default 
currently it's read from default first

###9. Create pg indexes on fields: url, name
