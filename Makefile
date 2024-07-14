BUCKET = s3://exercise.manugoyal.com
PREFIX = aws --profile manu.goyal2013 --region us-west-2 s3
SYNCCMD = $(PREFIX) sync --delete app/build $(BUCKET)

sync:
	$(SYNCCMD)

dryrun:
	$(SYNCCMD) --dryrun

size:
	$(PREFIX) ls --recursive $(BUCKET) | \
		awk 'BEGIN {total = 0} {total += $$3} END {print total}'
