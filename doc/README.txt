Generating pretty-looking HTML from adoc:

$ sudo apt-get install asciidoctor
$ asciidoctor devel.adoc -D html -n -a toc=left

This will generate html/devel.html