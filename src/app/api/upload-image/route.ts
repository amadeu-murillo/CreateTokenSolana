import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { NextResponse } from 'next/server';


cloudinary.config({
  cloud_name: 'dgurmzcht',
  api_key: '376481879818689',
  api_secret: 'YfZk9mhp8eVA6xaZOZzHbF2H_qM',
});


export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Usando uma Promise para encapsular o upload_stream
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        // Opções opcionais, como a pasta para salvar
        folder: 'token_images', 
      }, (error, result) => {
        if (error) {
          console.error("Erro no Upload para Cloudinary:", error);
          reject(error);
        }
        // 'result' pode ser undefined em caso de erro, mas o 'error' seria lançado primeiro
        resolve(result!);
      }).end(buffer);
    });

    return NextResponse.json({ secure_url: result.secure_url });

  } catch (error) {
    console.error("Erro no endpoint /api/upload-image:", error);
    // Retornando uma mensagem de erro mais genérica para o cliente
    return NextResponse.json({ error: "Falha ao fazer upload da imagem." }, { status: 500 });
  }
}