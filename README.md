# Filtro do 1º aninho da Alice

## Usar o filtro

Na capa, **Usar moldura** abre a câmera. A opção **Escolher foto da galeria** permite selecionar uma imagem do celular sem conceder acesso à câmera. Na tela do filtro também há um botão de galeria para trocar ou escolher outra foto. A imagem é ajustada ao formato vertical da moldura; as partes excedentes são cortadas pelo centro. Depois, escolha um efeito e toque no botão central para gerar a foto com `moldura.png`.

A câmera e a seleção de fotos funcionam em um site publicado por HTTPS, como no GitHub Pages.

## Onde mudar o nome do evento

As ocorrências do evento já foram atualizadas para **Alice 1 aninho**. Se quiser alterar o nome do evento futuramente, procure os comentários `PERSONALIZAÇÃO DO NOME`:

- `index.html`: atualize o título e o texto do nome na capa (`<h1>`). O título e o `og:title` também definem o nome exibido na aba e na prévia do link.
- `script.js`: atualize `EVENT_NAME` e `EVENT_FILE_SLUG`. Esses valores personalizam os nomes usados no compartilhamento e nos arquivos de foto/vídeo salvos.
- `moldura.png` e `preview.jpg`: os nomes que aparecem dentro dessas imagens estão desenhados na própria imagem. Para trocar os nomes nelas, substitua esses arquivos por versões atualizadas mantendo os mesmos nomes dos arquivos.

## Onde mudar a cor

Em `style.css`, no início do arquivo, dentro de `:root`, altere `--brand` e `--brand-dark`. Neste evento, as cores são `#7cb6de` e `#f581bc`. Esse é o comentário `PERSONALIZAÇÃO DA COR`. As outras cores são tons de contraste usados para manter os textos e botões legíveis.

## Personalizar imagens

- `preview.jpg`: imagem exibida na prévia do link enviado por WhatsApp; também está indicada em `og:image` no `index.html`.
- `Capa.jfif`: imagem de fundo da tela de introdução. Substitua-a mantendo exatamente o nome `Capa.jfif`.
- `moldura.png`: moldura PNG transparente que é sobreposta à imagem da câmera ou à foto da galeria. Para outro evento, substitua-a mantendo o mesmo nome. Recomenda-se uma moldura vertical de proporção 9:16.

## Publicar no GitHub Pages

Envie os arquivos da pasta para a raiz do repositório e publique com o GitHub Pages. A câmera exige HTTPS e solicitará permissão quando a pessoa tocar em **Usar moldura**. A seleção de uma imagem da galeria não exige permissão de câmera.

O botão **Enviar para o Instagram** usa o compartilhamento nativo do celular. No iPhone, **Salvar na galeria** abre a folha de compartilhamento, onde a pessoa deve escolher **Salvar Imagem** ou **Salvar em Fotos**. O navegador não pode gravar diretamente na Fototeca sem essa confirmação do iOS. Em aparelhos que não oferecem o compartilhamento nativo, a foto é baixada para que a pessoa possa anexá-la manualmente no Instagram.
