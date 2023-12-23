#!/usr/bin/env bash

CURRENT_DATETIME=`date +"%Y-%m-%d.%H-%M-%S"`
FILENAME="zkorum.$CURRENT_DATETIME.dump"
FILEPATH="/home/ubuntu/backup/postgres/$FILENAME"
BUCKET_NAME="zkorum-postgres-backup"
S3_LOCATION="s3://$BUCKET_NAME/$FILENAME"

sudo docker exec zkorum_postgres pg_dump -U postgres -Fc zkorum > "$FILEPATH"

sudo chown ubuntu:ubuntu $FILEPATH
sudo chmod 400 $FILEPATH

aws s3 cp "$FILEPATH" "$S3_LOCATION"
