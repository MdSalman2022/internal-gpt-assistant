export default function Home() {
  return (
    <main className="section-container section-padding">
      <div className="text-center">
        <h1 className="heading-primary mb-6">
          Welcome to <span className="text-gradient">Your App</span>
        </h1>
        <p className="text-body max-w-2xl mx-auto mb-8">
          Get started by editing <code className="bg-background-secondary px-2 py-1 rounded">app/page.js</code>
        </p>
        <div className="flex gap-4 justify-center">
          <a href="#" className="btn-primary">
            Get Started
          </a>
          <a href="#" className="btn-secondary">
            Learn More
          </a>
        </div>
      </div>
    </main>
  );
}
