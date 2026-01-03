import type { VaultCategory } from "./document-types"

export const vaultData: VaultCategory[] = [
  {
    id: "company",
    name: "Company Data",
    values: [
      { id: "company-name", label: "Company Name", value: "Acme Corporation" },
      { id: "company-address", label: "Company Address", value: "123 Main Street, New York, NY 10001" },
      { id: "company-email", label: "Company Email", value: "contact@acmecorp.com" },
      { id: "company-phone", label: "Company Phone", value: "+1 (555) 123-4567" },
      { id: "tax-id", label: "Tax ID", value: "12-3456789" },
    ],
  },
  {
    id: "contacts",
    name: "Contacts",
    values: [
      { id: "contact-ceo", label: "CEO", value: "John Smith" },
      { id: "contact-cfo", label: "CFO", value: "Jane Doe" },
      { id: "contact-legal", label: "Legal Counsel", value: "Robert Johnson" },
      { id: "contact-hr", label: "HR Manager", value: "Sarah Williams" },
    ],
  },
  {
    id: "addresses",
    name: "Addresses",
    values: [
      { id: "hq-address", label: "HQ Address", value: "123 Main Street, New York, NY 10001" },
      { id: "warehouse-address", label: "Warehouse", value: "456 Industrial Blvd, Newark, NJ 07102" },
      { id: "office-la", label: "LA Office", value: "789 Sunset Blvd, Los Angeles, CA 90028" },
    ],
  },
  {
    id: "legal",
    name: "Legal",
    values: [
      { id: "jurisdiction", label: "Jurisdiction", value: "State of New York" },
      { id: "incorporation-date", label: "Incorporation Date", value: "January 15, 2020" },
      { id: "legal-entity", label: "Legal Entity Type", value: "Delaware C-Corporation" },
    ],
  },
]
