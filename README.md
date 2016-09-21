# Database

### Database setup

Before start, make sure you've got at least PgSQL 9.4 in your system, it's configured to listen localhost connection (refer to `postgresql.conf`) and accept 
md5 authentication (refer to `pg_hba.conf`).

Command below must be run from postgres system user (switch to root user then switch to postgres by su postgres). When prompted for password, enter 
`gpwcmd`.

```
createuser gpwcmd -P && createdb gpwcmd -O gpwcmd && psql -d gpwcmd -c 'ALTER SCHEMA public OWNER TO gpwcmd;'
```

### Document table backup

```
pg_dump -h localhost -U gpwcmd -W -h localhost -a -n public -t document -v --format=tar -f dump.document.tar.gz gpwcmd
```
You can also use custom format, it's probably even lighter.

### Document table restore

```
pg_restore -h localhost -U gpwcmd -W -n public -t document -a -v --format=tar dump.document.tar.gz -d gpwcmd
```

### Issue on OS X

If you encounter issue like this:
```
Reason: Incompatible library version: node_libcurl.node requires version 9.0.0 or later, but libcurl.4.dylib provides version 7.0.0
```
Try this:
```
npm install node-libcurl --build-from-source
```
