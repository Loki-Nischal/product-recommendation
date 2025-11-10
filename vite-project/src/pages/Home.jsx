import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Star, Users, Zap } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-linear-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Smart Product Recommendations
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Discover products you'll love with our AI-powered recommendation engine
          </p>
          {user ? (
            <Link
              to="/recommendations"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              Get Recommendations <ArrowRight size={20} />
            </Link>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our System?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered</h3>
              <p className="text-gray-600">
                Advanced machine learning algorithms provide personalized recommendations based on your preferences.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-green-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Personalized</h3>
              <p className="text-gray-600">
                Recommendations tailored specifically to your interests, behavior, and preferences.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-purple-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Learning</h3>
              <p className="text-gray-600">
                The system learns from your interactions to continuously improve recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Discover Amazing Products?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who find their perfect products with our recommendation system.
          </p>
          {!user && (
            <Link
              to="/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              Start Your Journey Today
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;