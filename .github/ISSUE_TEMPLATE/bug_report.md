name: Bug report
description: Create a report to help us improve ProofPass
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: Thanks for taking the time to report a bug!
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Also tell us what you expected to happen
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Relevant log output
      render: shell
