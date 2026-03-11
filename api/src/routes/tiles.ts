import { corsHeaders } from '../utils/cors.ts';
import { exportTiles } from '../services/map-tiles.ts';

export const handleTileRoutes = async (req: Request, pathname: string): Promise<Response> => {
  if (req.method === 'POST' && pathname === '/export-tiles') {
    try {
      const body = (await req.json()) as any;
      const { country_code, bbox, minZoom = 0, maxZoom = 8 } = body;

      if (!country_code || typeof country_code !== 'string') {
        return new Response(JSON.stringify({ error: 'Missing or invalid country_code' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
        return new Response(
          JSON.stringify({
            error: 'Missing or invalid bbox array [minLon, minLat, maxLon, maxLat]',
          }),
          { status: 400, headers: corsHeaders },
        );
      }

      if (maxZoom > 8) {
        return new Response(JSON.stringify({ error: 'Max zoom level restricted to 8' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const archiveBuffer = await exportTiles({ country_code, bbox, minZoom, maxZoom });

      return new Response(archiveBuffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/gzip',
          'Content-Disposition': `attachment; filename="${country_code}-tiles.tar.gz"`,
        },
      });
    } catch (err: unknown) {
      console.error('Error generating tiles archive:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      return new Response(JSON.stringify({ status: 'error', message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Not Found', { status: 404, headers: corsHeaders });
};
