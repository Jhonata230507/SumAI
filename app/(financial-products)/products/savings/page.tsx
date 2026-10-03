import { CategoryListing, categoryMetadata } from '../CategoryListing'

export function generateMetadata() {
  return categoryMetadata('savings')
}

export default function SavingsAccountsPage() {
  return <CategoryListing category="savings" calculatorHref="/calculators/savings" />
}
