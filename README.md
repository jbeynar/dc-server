# Database


### Database setup

Before start, make sure you've got at least PgSQL 9.4 in your system, it's configured to listen localhost connection (refer to `postgresql.conf`) and accept 
md5 authentication (refer to `pg_hba.conf`).

Command below must be run from postgres system user (switch to root user then switch to postgres by su postgres). When prompted for password, enter 
`jbl-dc`.

```
createuser jbl-dc -P && createdb jbl-dc -O jbl-dc && psql -d jbl-dc -c 'ALTER SCHEMA public OWNER TO jbl-dc;'
```

### Document table backup

```
pg_dump -h localhost -U jbl-dc -W -h localhost -a -n public -t document -v --format=tar -f dump.document.tar.gz jbl-dc
```
You can also use custom format, it's probably even lighter.

### Document table restore

```
pg_restore -h localhost -U jbl-dc -W -n public -t document -a -v --format=tar dump.document.tar.gz -d jbl-dc
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

# TypeScript
### Watch and transpile TypeScript files
```
tsc -w --pretty
```

You can also configure Webstorm to transpile them using options from tsconfig.json (Open settings and search for "use tsconfig.json")
