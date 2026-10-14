import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Heart, 
  Flag, 
  Rocket, 
  Library, 
  Brain, 
  Baby, 
  Plus 
} from 'lucide-react';

const categories = [
  { name: 'Fiction', icon: BookOpen, slug: 'fiction' },
  { name: 'Romance', icon: Heart, slug: 'romance' },
  { name: 'Filipino', icon: Flag, slug: 'filipino' },
  { name: 'Sci-Fi', icon: Rocket, slug: 'sci-fi' },
  { name: 'Non-Fiction', icon: Library, slug: 'non-fiction' },
  { name: 'Self-Help', icon: Brain, slug: 'self-help' },
  { name: 'Children', icon: Baby, slug: 'children' },
  { name: 'More', icon: Plus, slug: 'more' },
];

export function Categories() {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 md:gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.slug}
              to={`/books?category=${category.slug}`}
              className="px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-gray-200 bg-white text-sm text-gray-600 hover:border-navy-400 hover:text-navy-700 hover:shadow-sm transition-all duration-200 flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
