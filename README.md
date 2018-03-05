# JBL Data Center Server

## Database

### Database seed

In order to seed database run `npm run seed` and to seed testing schema run `MOCHA=true npm run seed`.

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

### Issue on Debian
1. chmod 777 on esedate
2. sudo sysctl -w vm.max_map_count=262144

## TypeScript
### Watch and transpile TypeScript files
```
tsc -w --pretty
```

You can also configure Webstorm to transpile them using options from tsconfig.json (Open settings and search for "use tsconfig.json")

## JBL Data Center Launcher
Listing job's tasks run:
```
npm run dc jobName listTasks
```

Executing specific task run:
```
npm run dc jobName specificTaskName
```

Executing all job's task:
```
npm run dc jobName
```
