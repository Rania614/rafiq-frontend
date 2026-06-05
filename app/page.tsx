export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-light p-6">
      <h1 className="text-4xl font-bold text-primary-500 font-display animate-fade-in">
        Rafiq Training - Day 2 Setup 🚀
      </h1>
      <p className="mt-2 text-neutral-dark font-body">
        Tailwind CSS Variables are working perfectly!
      </p>
      <button className="mt-4 rounded-custom bg-secondary px-6 py-2 text-white font-medium hover:opacity-90">
        Test Button
      </button>
    </div>
  );
}