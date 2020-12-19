.PHONY: all
all:
	cd data; make
	cd b_sophia; make
	cd b_nodejs; make
	mkdir csv

