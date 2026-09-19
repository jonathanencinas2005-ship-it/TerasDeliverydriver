import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, backTo }) {
  const navigate = useNavigate();
  return (
    <div className="page-header">
      <button type="button" onClick={() => (backTo ? navigate(backTo) : navigate(-1))} aria-label="Kembali">
        <ArrowLeft size={18} />
      </button>
      <h1>{title}</h1>
    </div>
  );
}
