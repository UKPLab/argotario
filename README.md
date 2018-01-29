# Argotario

**Argotario** is a serious game that deals with fallacies in everyday argumentation. **Argotario** is a multilingual, open-source, platform-independent application with strong educational aspects, accessible at www.argotario.net.

The paper is available in the [ACL Anthology](http://www.aclweb.org/anthology/D17-2002). Please use the following citation:

```
@InProceedings{Habernal.et.al.2017.EMNLP,
  author    = {Habernal, Ivan and Hannemann, Raffael and Pollak, Christian and
               Klamm, Christopher and Pauli, Patrick and Gurevych, Iryna},
  title     = {Argotario: Computational Argumentation Meets Serious Games},
  booktitle = {Proceedings of the 2017 Conference on Empirical Methods in Natural Language Processing: System Demonstrations},
  month     = sep,
  year      = {2017},
  address   = {Copenhagen, Denmark},
  publisher = {Association for Computational Linguistics},
  pages     = {7--12},
  url       = {http://www.aclweb.org/anthology/D17-2002}
}
```
> **Abstract:** An important skill in critical thinking and argumentation is the ability to spot and recognize fallacies. Fallacious arguments, omnipresent in argumentative discourse, can be deceptive, manipulative, or simply leading to `wrong moves' in a discussion. Despite their importance, argumentation scholars and NLP researchers with focus on argumentation quality have not yet investigated fallacies empirically. The nonexistence of resources dealing with fallacious argumentation calls for scalable approaches to data acquisition and annotation, for which the serious games methodology offers an appealing, yet unexplored, alternative. We present Argotario, a serious game that deals with fallacies in everyday argumentation. Argotario is a multilingual, open-source, platform-independent application with strong educational aspects, accessible at www.argotario.net. 


Contact person: Ivan Habernal
* habernal@ukp.informatik.tu-darmstadt.de
* https://www.ukp.tu-darmstadt.de/
* https://www.tu-darmstadt.de/

Don't hesitate to send us an e-mail or report an issue, if something is broken (and it shouldn't be) or if you have further questions.

> This repository contains experimental software and is published for the sole purpose of giving additional background details on the respective publication. 


Developer documentation is available in [doc/devel.adoc](./doc/devel.adoc) and [doc/faq.adoc](./doc/faq.adoc).

## English data

![CC0](http://i.creativecommons.org/p/zero/1.0/88x31.png)

The English data are available under the [Creative Commons Zero (CC0)](https://creativecommons.org/publicdomain/zero/1.0/) license. The data are anonymous, user names were hashed before publishing.

The tab-separated text file is located under ``data/arguments-en-2018-01-15.tsv``.

Please cite our EMNLP'17 paper (see above) if you use the English corpus for any work. 

## German data

![CC0](http://i.creativecommons.org/p/zero/1.0/88x31.png)

The German data are available under the [Creative Commons Zero (CC0)](https://creativecommons.org/publicdomain/zero/1.0/) license. The data are anonymous, user names were hashed before publishing.

The tab-separated text file is located under ``data/arguments-de-2018-01-15.tsv``.

Please cite our LREC'18 paper (see below) if you use the English corpus for any work.

```
@inproceedings{Habernal.et.al.2018.LREC,
    title     = {{Adapting Serious Game for Fallacious Argumentation to German:
	              Pitfalls, Insights, and Best Practices}},
    author    = {Habernal, Ivan and Pauli, Patrick and Gurevych, Iryna},
    booktitle = {Proceedings of the Eleventh International Conference on Language Resources
                 and Evaluation (LREC 2018)},
    pages     = {in press},
    month     = {May},
    year      = {2018},
    address   = {Miyazaki, Japan},
    publisher = {European Language Resources Association (ELRA)},
}
```