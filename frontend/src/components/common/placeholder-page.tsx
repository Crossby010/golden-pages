import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cream flex items-center justify-center">
          <Construction className="w-10 h-10 text-brass-500" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-navy-700 mb-3">
          {title}
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          {description || `The ${title} page is coming soon. We're working hard to bring it to you.`}
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button variant="outline" className="h-11">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link to="/books">
            <Button className="bg-brass-500 hover:bg-brass-600 text-white h-11">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Books
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
