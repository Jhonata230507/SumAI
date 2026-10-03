import { CategoryListing, categoryMetadata } from '../CategoryListing'

export function generateMetadata() {
  return categoryMetadata('mortgage')
}

export default function MortgagesPage() {
  return <CategoryListing category="mortgage" calculatorHref="/calculators/mortgage" />
}
