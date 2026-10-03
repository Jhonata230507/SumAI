import { CategoryListing, categoryMetadata } from '../CategoryListing'

export function generateMetadata() {
  return categoryMetadata('personal-loan')
}

export default function PersonalLoansPage() {
  return <CategoryListing category="personal-loan" calculatorHref="/calculators/loan" />
}
