/** The title at the top of a console page: the page's only `h1`. */
export function PageHeader({ title }: { title: string }) {
  return <h1 className="mb-4 text-xl font-semibold md:mb-6">{title}</h1>;
}
