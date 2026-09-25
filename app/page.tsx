import Image from 'next/image';
import Link from 'next/link';

const WHATSAPP_URL = 'https://wa.me/5587991287836';
const VENDA_URL = 'https://venda.nextfit.com.br/73b52987-1cdc-448b-851f-680f586592f2/contratos';
const INSTAGRAM_HANDLE = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || 'r15academia';

const PLANOS = [
  {
    nome: 'Mensal',
    preco: 'R$ 115',
    periodo: '/mês',
    destaque: false,
    beneficios: ['Liberdade total', 'Acesso livre a toda a área e equipamentos', 'Ambiente climatizado', 'Avaliação trimestral'],
  },
  {
    nome: 'Anual',
    preco: 'R$ 85',
    periodo: '/mês',
    detalhe: '12x — total R$ 1.020',
    destaque: true,
    beneficios: ['Melhor custo-benefício', 'Acesso livre a toda a área e equipamentos', 'Ambiente climatizado', 'Avaliação trimestral'],
  },
  {
    nome: 'Recorrente',
    preco: 'R$ 95',
    periodo: '/mês',
    destaque: false,
    beneficios: ['Praticidade e renovação automática', 'Acesso livre a toda a área e equipamentos', 'Ambiente climatizado', 'Avaliação trimestral'],
  },
];

const HORARIOS = [
  { dias: 'Segunda à sexta', horas: '5h às 23h' },
  { dias: 'Sábado', horas: '8h às 20h' },
  { dias: 'Domingos e feriados', horas: '8h às 14h' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="flex flex-col items-center gap-4 px-4 pt-16 pb-14 text-center">
        <Image src="/r15-logo.png" alt="R15 Academia" width={611} height={471} className="h-52 w-auto" priority />
        <h1 className="mt-4 max-w-md text-2xl font-bold text-neutral-50 sm:text-3xl">Escolha seu plano. Eleve seu nível.</h1>
        <Link
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Falar no WhatsApp
        </Link>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-4 pb-20">
        <section>
          <h2 className="mb-6 text-center text-xl font-bold text-neutral-50">Nossos planos</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {PLANOS.map((plano) => (
              <div
                key={plano.nome}
                className={`flex flex-col gap-4 rounded-2xl border p-6 ${
                  plano.destaque ? 'border-red-600 bg-neutral-900 ring-1 ring-red-600' : 'border-neutral-800 bg-neutral-900/60'
                }`}
              >
                {plano.destaque && (
                  <span className="w-fit rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                    Melhor custo-benefício
                  </span>
                )}
                <span className="text-sm font-semibold tracking-wide text-neutral-300 uppercase">{plano.nome}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-neutral-50">{plano.preco}</span>
                  <span className="text-sm text-neutral-400">{plano.periodo}</span>
                </div>
                {plano.detalhe && <span className="text-xs text-neutral-500">{plano.detalhe}</span>}
                <a
                  href={VENDA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-red-500"
                >
                  Assinar
                </a>
                <ul className="flex flex-col gap-2 text-sm text-neutral-300">
                  {plano.beneficios.map((beneficio) => (
                    <li key={beneficio} className="flex gap-2">
                      <span className="text-red-600">✓</span>
                      {beneficio}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 sm:grid-cols-2">
          <div>
            <h2 className="mb-4 text-lg font-bold text-neutral-50">Horários de funcionamento</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {HORARIOS.map((h) => (
                <li key={h.dias} className="flex items-center justify-between border-b border-neutral-800 py-2">
                  <span className="text-neutral-300">{h.dias}</span>
                  <span className="font-semibold text-neutral-50">{h.horas}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold text-neutral-50">Contato e localização</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-neutral-500">Endereço</dt>
                <dd className="text-neutral-200">Av. José Pereira de Souza, Manoela Valadares</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Telefone</dt>
                <dd className="text-neutral-200">(87) 99128-7836</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Instagram</dt>
                <dd>
                  <a
                    href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 hover:underline"
                  >
                    @{INSTAGRAM_HANDLE}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
    </div>
  );
}
