import { Link } from "@/navigation";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between">
      <div className="font-bold text-xl">Regatta Manager</div>
      <div className="space-x-4">
        <Link href="/">Home</Link>
        <Link href="/regatten">Regatten</Link>
        <Link href="/regatten/new">Neue Regatta</Link>
      </div>
    </nav>
  );
}
 