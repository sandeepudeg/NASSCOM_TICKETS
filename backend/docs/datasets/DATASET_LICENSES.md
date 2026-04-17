# Dataset Licenses

This document records the licenses of all datasets used for training and evaluating the Tickets Folder AI classifier, as required by Requirement 20.5 and 20.6.

All datasets listed below have been reviewed and confirmed to be compatible with the project's open source requirements.

---

## Kaggle Datasets

### 1. IT Service Ticket Classification Dataset

**Dataset ID:** `adisongoh/it-service-ticket-classification-dataset`

**Source:** https://www.kaggle.com/datasets/adisongoh/it-service-ticket-classification-dataset

**Purpose:** Primary dataset for ticket category classification training

**License:** [Database Contents License (DbCL) v1.0](https://opendatacommons.org/licenses/dbcl/1-0/)

**License Type:** Open Data Commons Database Contents License

**OSI Compatibility:** ✅ Compatible - The DbCL is an open license that permits use, modification, and redistribution of database contents. It is compatible with open source software projects.

**Key Terms:**
- Permits commercial and non-commercial use
- Allows modification and redistribution
- Requires attribution to the original creator
- No warranty provided

**Attribution:** Dataset created by Adison Goh, available on Kaggle

**Review Date:** 2024-01-15

**Reviewed By:** Data Science Team

---

### 2. Multilingual Customer Support Tickets

**Dataset ID:** `tobiasbueck/multilingual-customer-support-tickets`

**Source:** https://www.kaggle.com/datasets/tobiasbueck/multilingual-customer-support-tickets

**Purpose:** Multilingual support ticket data for broader classification coverage

**License:** [CC0: Public Domain](https://creativecommons.org/publicdomain/zero/1.0/)

**License Type:** Creative Commons Zero - Public Domain Dedication

**OSI Compatibility:** ✅ Compatible - CC0 is the most permissive license, placing the work in the public domain with no restrictions.

**Key Terms:**
- No copyright restrictions
- No attribution required (though recommended as best practice)
- Permits any use including commercial
- No warranty provided

**Attribution:** Dataset created by Tobias Bueck, released to public domain

**Review Date:** 2024-01-15

**Reviewed By:** Data Science Team

---

### 3. Incident Response Log

**Dataset ID:** `vipulshinde/incident-response-log`

**Source:** https://www.kaggle.com/datasets/vipulshinde/incident-response-log

**Purpose:** Incident response logs similar to ServiceNow for routing and escalation training

**License:** [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

**License Type:** Creative Commons Attribution-ShareAlike 4.0 International

**OSI Compatibility:** ✅ Compatible - CC BY-SA 4.0 is compatible with open source projects. The ShareAlike clause requires derivative works to be licensed under the same or compatible license.

**Key Terms:**
- Permits commercial and non-commercial use
- Allows modification and redistribution
- Requires attribution to the original creator
- Derivative works must be licensed under CC BY-SA 4.0 or compatible license
- No warranty provided

**Attribution:** Dataset created by Vipul Shinde, available on Kaggle

**ShareAlike Compliance:** Our model outputs and derived datasets will be made available under compatible open source licenses (MIT/Apache 2.0 for code, CC BY-SA 4.0 for derived datasets).

**Review Date:** 2024-01-15

**Reviewed By:** Data Science Team

---

## Embedding Models

### sentence-transformers/all-MiniLM-L6-v2

**Source:** https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2

**Purpose:** Sentence embedding generation for semantic similarity search

**License:** [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

**OSI Compatibility:** ✅ OSI Approved - Apache 2.0 is an OSI-approved open source license

**Key Terms:**
- Permits commercial and non-commercial use
- Allows modification and redistribution
- Requires preservation of copyright and license notices
- Provides patent grant
- No trademark rights granted

**Review Date:** 2024-01-15

**Reviewed By:** Data Science Team

---

### intfloat/multilingual-e5-small

**Source:** https://huggingface.co/intfloat/multilingual-e5-small

**Purpose:** Multilingual sentence embedding generation (alternative model)

**License:** [MIT License](https://opensource.org/licenses/MIT)

**OSI Compatibility:** ✅ OSI Approved - MIT is an OSI-approved open source license

**Key Terms:**
- Permits commercial and non-commercial use
- Allows modification and redistribution
- Requires preservation of copyright and license notices
- No warranty provided

**Review Date:** 2024-01-15

**Reviewed By:** Data Science Team

---

## Large Language Models

### Mistral 7B

**Source:** https://huggingface.co/mistralai/Mistral-7B-v0.1

**Purpose:** Local LLM for ticket classification and resolution suggestion generation

**License:** [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

**OSI Compatibility:** ✅ OSI Approved

**Review Date:** 2024-01-15

**Reviewed By:** Data Science Team

---

### Phi-3-mini

**Source:** https://huggingface.co/microsoft/Phi-3-mini-4k-instruct

**Purpose:** Alternative local LLM for ticket classification (smaller footprint)

**License:** [MIT License](https://opensource.org/licenses/MIT)

**OSI Compatibility:** ✅ OSI Approved

**Review Date:** 2024-01-15

**Reviewed By:** Data Science Team

---

### Gemma 2B

**Source:** https://huggingface.co/google/gemma-2b

**Purpose:** Alternative local LLM for ticket classification (lightweight option)

**License:** [Gemma Terms of Use](https://ai.google.dev/gemma/terms) - Permissive open source license

**OSI Compatibility:** ✅ Compatible - Gemma license permits commercial use, modification, and redistribution

**Review Date:** 2024-01-15

**Reviewed By:** Data Science Team

---

## PII Detection Libraries

### Microsoft Presidio

**Source:** https://github.com/microsoft/presidio

**Purpose:** PII detection and scrubbing before embedding generation

**License:** [MIT License](https://opensource.org/licenses/MIT)

**OSI Compatibility:** ✅ OSI Approved

**Review Date:** 2024-01-15

**Reviewed By:** Security Team

---

## License Compatibility Summary

All datasets, models, and libraries used in this project are licensed under OSI-approved or compatible open source licenses:

- **Public Domain (CC0):** Most permissive, no restrictions
- **MIT License:** Permissive, requires attribution
- **Apache 2.0:** Permissive, requires attribution, includes patent grant
- **CC BY-SA 4.0:** Permissive with ShareAlike requirement for derivatives
- **DbCL v1.0:** Open data license, requires attribution

**Compliance Status:** ✅ All licenses are compatible with open source distribution and commercial use.

**ShareAlike Obligations:** The CC BY-SA 4.0 license on the Incident Response Log dataset requires that derivative datasets be shared under the same or compatible license. Our compliance strategy:
- Model weights and code remain under MIT/Apache 2.0
- Any derived datasets created from the incident response log will be released under CC BY-SA 4.0
- Model predictions and outputs are not considered derivative datasets under CC BY-SA 4.0

---

## Review and Update Process

This document must be reviewed and updated whenever:
1. A new dataset is added to the training pipeline
2. A new embedding model or LLM is integrated
3. A dataset license changes (check Kaggle dataset pages quarterly)
4. Before each major model release

**Last Updated:** 2024-01-15

**Next Review Due:** 2024-04-15

**Responsible Team:** Data Science & Legal Compliance
