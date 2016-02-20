## Database setup

Command below must be run from postgres system user (switch to root user then switch to postgres by su postgres). When prompted for password, enter 
`gpwcmd`.

```
createuser gpwcmd -P && createdb gpwcmd -O gpwcmd && psql -d gpwcmd -c 'ALTER SCHEMA public OWNER TO gpwcmd;'
```
