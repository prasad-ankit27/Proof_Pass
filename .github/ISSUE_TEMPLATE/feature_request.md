name: Feature request
description: Suggest an idea or feature for ProofPass
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: Thank you for suggesting a new idea for ProofPass!
  - type: textarea
    id: problem
    attributes:
      label: Is your feature request related to a problem?
      description: A clear and concise description of what the problem is.
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Describe the solution you'd like
      description: A clear and concise description of what you want to happen.
    validations:
      required: true
