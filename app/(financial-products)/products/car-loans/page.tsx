import { CategoryListing, categoryMetadata } from '../CategoryListing'

export function generateMetadata() {
  return categoryMetadata('car-loan')
}

export default function CarLoansPage() {
  return <CategoryListing category="car-loan" calculatorHref="/calculators/car-loan" />
}
