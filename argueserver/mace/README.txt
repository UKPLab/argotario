MACE (Multi-Annotator Competence Estimation)
=============================================
	When evaluating redundant annotation (like those from Amazon's MechanicalTurk), we have to 
	a) recover the most likely answer
	b) find out which annotators are trustworthy

	MACE solves both problems, by learning competence estimates for each annotators and computing the most likely answer based on those.


USAGE:
=======
	(lines starting with '$' denote command line input)

	Shell script:
	--------------
	$./MACE [options] <CSV input file>
			 or
	JAVA:
	------
	$java -jar MACE.jar [options] <CSV input file>


Options:
	--help:			display this information

	--iterations <1-1000>:	number of iterations for each EM start. Default: 50

	--prefix <STRING>:	prefix used for output files.

	--restarts <1-1000>:	number of random restarts to perform. Default: 10

	--smoothing <0.0-1.0>:	smoothing added to fractional counts before normalization.
				Higher values mean smaller changes. Default: 0.1/|values|

	--test <FILE>:		supply a test file. Each line corresponds to one item in the CSV file,
				so the number of lines must match. If a test file is supplied,
				MACE outputs the accuracy of the predictions

	--threshold <0.0-1.0>:	only predict the label for instances whose entropy is among the top n%, ignore others.
				Thus '--threshold 0.0' will ignore all instances, '--threshold 1.0' includes all.
				This improves accuracy at the expense of coverage. Default: 1.0

INPUT:
=======
	The input file has to be a comma-separated file, where each line represents an item, and each column represents an annotator.
	Empty values represent no annotation by the specific annotator on that item.
	Example:

	0,1,,,,1,0,0
	,,1,1,,0,0,1
	1,0,0,1,,1,,0

	Make sure the last line has a line break.

OUTPUT:
=======
	MACE provides two output files:
	- the most likely answer for each item, <prefix.>prediction. This file has the same number of lines as the input file.
	- the competence estimate for each annotator, <prefix.>competence. This file has one line with tab separated values.

EXAMPLES
=========
	$java -jar MACE.jar example.csv
	Evaluate the file example.csv and write the output to "competence" and "prediction".

	$java -jar MACE.jar --prefix out example.csv
	Evaluate the file example.csv and write the output to "out.competence" and "out.prediction".

	$java -jar MACE.jar --test example.key example.csv
	Evaluate the file example.csv against the true answers in example.key. 
	Write the output to "competence" and "prediction" and print the accuracy to STDOUT (acc=0.8)

	$java -jar MACE.jar --threshold 0.9 example.csv
	Evaluate the file example.csv. Return predictions only for the 90% of items the model is most confident in (acc=0.84). 
	Write the output to "competence" and "prediction". The latter will have blank lines for ignored items. 

	$java -jar MACE.jar --threshold 0.9 example.csv
	Evaluate the file example.csv. Return predictions only for the top 90% of items the model is most confident in. 
	Write the output to "competence" and "prediction". The latter will have blank lines for ignored items. 
	Compute the accuracy of only the predicted items and write to STDOUT.

