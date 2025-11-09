-- Function: refresh_rekapitulasi_unit_cost_all
-- Description: Refreshes consolidated unit cost data for a specific year
--              across all users by delegating to the existing per-user
--              refresh routine. This ensures the rekapitulasi table reflects
--              the latest data from the seven source tables without relying
--              on whoever last updated the records.

CREATE OR REPLACE FUNCTION public.refresh_rekapitulasi_unit_cost_all(
    p_tahun INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    rec RECORD;
BEGIN
    IF p_tahun IS NULL THEN
        RAISE EXCEPTION 'Parameter p_tahun tidak boleh NULL';
    END IF;

    -- Iterate through every user that has data either in the sources
    -- or in the existing rekapitulasi table for the requested year.
    FOR rec IN
        SELECT DISTINCT user_id
        FROM (
            SELECT user_id FROM public.rekapitulasi_unit_cost WHERE tahun = p_tahun
            UNION
            SELECT user_id FROM public.kalkulasi_biaya_laboratorium WHERE tahun = p_tahun
            UNION
            SELECT user_id FROM public.kalkulasi_biaya_radiologi WHERE tahun = p_tahun
            UNION
            SELECT user_id FROM public.kalkulasi_bdrs WHERE tahun = p_tahun
            UNION
            SELECT user_id FROM public.kalkulasi_tindakan_inap WHERE tahun = p_tahun
            UNION
            SELECT user_id FROM public.kalkulasi_tindakan_rawat_jalan WHERE tahun = p_tahun
            UNION
            SELECT user_id FROM public.kalkulasi_biaya_operatif WHERE tahun = p_tahun
            UNION
            SELECT user_id FROM public.kalkulasi_biaya_cathlab WHERE tahun = p_tahun
        ) AS sumber
        WHERE user_id IS NOT NULL
    LOOP
        BEGIN
            PERFORM public.refresh_rekapitulasi_unit_cost(rec.user_id, p_tahun);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Gagal refresh rekapitulasi untuk user % tahun %: %',
                    rec.user_id, p_tahun, SQLERRM;
        END;
    END LOOP;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.refresh_rekapitulasi_unit_cost_all(INTEGER) TO anon, authenticated;

