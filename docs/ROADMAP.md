# Data Center Roadmap

## 2017 Q2

###1. extractTask support postgresql elasticsearch and mongodb exporters
adapter should be provide as a rxjs operator callback.

benefits: faster data export

###2. downloadTask perform extraction+export in one rxjs chain

benefits:
faster data acquisition; continuous data export; see structured data as soon as it arrive

###3. Merge class declaration + libs code of: downloader, extractor. for libs/Task only (don't include repo,db,launch,logger)
benefits: code quality

###4. Capture process signals in downloader

* capture Ctrl+C and exit
* capture other signal for retry (ignore IT)

###5. Downloader mode (mode=simple | fill | update)

* simple - work as it is, download every UrlItem
* fill - scan document_http table and proceed with all non-200 or missing records
* update - take intersection of input and document_http table and proceed with the oldest

###6. Maintain jbl-dc-repo
Revert to angular 1.x

###7. Centralize PostgreSQL DC?
Standalone private dedicated server with newest PgSQL
benefits: first step for distributed system, easy to write from many instances, don't have to do code deploy.

###8. Bugfix downloader should read Interval Time from job first OR default
currently it's read from default first

###9. Create pg indexes on fields: url, name
