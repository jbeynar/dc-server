# JBL Data Center Server

## Prerequirements
- NodeJS (tested on 8.12.0)
- Docker (tested on 18.03.1-ce)
- Docker Compose (tested on 1.21.1)

## Services
Use docker-compose.yml to ensure postgresql and elasticsearch; mongodb and kibana are optional services.

## Dependencies
Installing npm dependencies:
```
npm install
```

## Database seed
In order to seed database run:
```
npm run seed
``` 
and to seed schema for the tests run: 
```
MOCHA=true npm run seed
```

## Document table backup
```
pg_dump -h localhost -U jbl-dc -W -h localhost -a -n public -t document -v --format=tar -f dump.document.tar.gz jbl-dc
```
You can also use custom format, it's probably even lighter.

## Document table restore
```
pg_restore -h localhost -U jbl-dc -W -n public -t document -a -v --format=tar dump.document.tar.gz -d jbl-dc
```

## Elasticsearch issue on Debian
1. chmod 777 on esedate
2. sudo sysctl -w vm.max_map_count=262144


## Run tests
Before start and finish your work run tests
```
npm run test

```

## TypeScript
```
./node_modules/.bin/tsc
```

You can also configure WebStorm to transpile them using options from tsconfig.json (Open settings and search for "use tsconfig.json")

## DC job manager
Listing job's tasks run:
```
npm run dc jobName listTasks
```

Executing specific task run:
```
npm run dc jobName specificTaskName
```

Executing all job's tasks sequentially in order of job file:
```
npm run dc jobName
```

## Contribution

http://reactivex.io/documentation/operators.html
