import { Helmet } from 'react-helmet-async';

const SEOHead = ({ 
  title = "HiiHive - Connect, Learn, Grow with Your College Community",
  description = "Join HiiHive, the ultimate social platform for college students. Connect with classmates, share knowledge, discover events, and build lasting friendships in your academic journey.",
  keywords = "college social network, student community, campus life, study groups, college friends, academic collaboration, student marketplace, college events",
  image = "/logo512.png",
  url = "https://hiihive.com",
  type = "website",
  author = "HiiHive Team",
  twitterCard = "summary_large_image",
  locale = "en_US",
  siteName = "HiiHive"
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "HiiHive",
    "alternateName": "HiiHive College Social Network",
    "description": description,
    "url": url,
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "Web Browser, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "HiiHive",
      "url": "https://hiihive.com"
    },
    "featureList": [
      "Social Networking for College Students",
      "Knowledge Sharing Platform",
      "Campus Event Discovery",
      "Student Marketplace",
      "Study Groups and Collaboration",
      "Real-time Messaging",
      "Academic Resource Sharing"
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": "College Students"
    }
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <link rel="canonical" href={url} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${url}${image}`} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${url}${image}`} />
      <meta name="twitter:site" content="@hiihive" />
      <meta name="twitter:creator" content="@hiihive" />

      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      <meta name="application-name" content="HiiHive" />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="HiiHive" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://firebaseapp.com" />
      <link rel="preconnect" href="https://firestore.googleapis.com" />

      {/* DNS Prefetch for performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//firebaseapp.com" />
      <link rel="dns-prefetch" href="//storage.googleapis.com" />
    </Helmet>
  );
};

export default SEOHead;
