
run:
	go build
	./familyminder

clean:
	rm -rf data/*

# make new user=ray
new:
	mkdir data/$(user)
